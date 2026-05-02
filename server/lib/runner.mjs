/**
 * Subprocess runner for career-ops CLI scripts.
 * Provides both buffered (run) and streaming (stream via SSE) modes.
 */
import { spawn } from 'node:child_process';
import { PROJECT_ROOT } from './paths.mjs';

/**
 * Run a node script, return { code, stdout, stderr } when done.
 * Resolves even on non-zero exit (caller decides what to do).
 */
export function runNodeScript(scriptName, args = [], opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptName, ...args], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, ...(opts.env || {}) },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    const timer = opts.timeoutMs
      ? setTimeout(() => {
          child.kill('SIGTERM');
        }, opts.timeoutMs)
      : null;

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: stderr + '\n' + err.message });
    });
  });
}

/**
 * Stream a node script's output to an SSE response.
 * Sends `data: <line>\n\n` for every stdout/stderr line, then `event: done` with exit code.
 */
export function streamNodeScript(res, scriptName, args = []) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const send = (event, data) => {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send('start', { script: scriptName, args });

  const child = spawn(process.execPath, [scriptName, ...args], {
    cwd: PROJECT_ROOT,
    env: { ...process.env },
  });

  const handleChunk = (stream, chunk) => {
    const text = chunk.toString();
    for (const line of text.split('\n')) {
      if (line.length === 0) continue;
      send('log', { stream, line });
    }
  };

  child.stdout.on('data', (d) => handleChunk('stdout', d));
  child.stderr.on('data', (d) => handleChunk('stderr', d));

  const cleanup = () => {
    try {
      child.kill('SIGTERM');
    } catch {}
  };
  res.on('close', cleanup);

  child.on('close', (code) => {
    send('done', { code });
    res.end();
  });
  child.on('error', (err) => {
    send('error', { message: err.message });
    res.end();
  });
}
