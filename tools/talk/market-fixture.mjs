import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

// Isolated test configuration imports the current v2 quote/portfolio reads, SQLite and auth.
// No operational Spring configuration, provider beans, credentials or real evidence.
export async function marketFixture() {
  const directory = await mkdtemp(join(tmpdir(), 'ww-talk-market-'));
  const ready = join(directory, 'ready.json');
  const child = spawn('./gradlew', ['--no-daemon', 'talkMarketPreview', `-PpreviewReady=${ready}`], {
    cwd: fileURLToPath(new URL('../../evidence-service-java/', import.meta.url)),
    env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME,
      ...(process.env.JAVA_HOME ? { JAVA_HOME: process.env.JAVA_HOME } : {}) },
    stdio: ['ignore', 'pipe', 'pipe'], detached: true
  });
  let failure;
  child.on('error', error => { failure = error; });
  // Drain diagnostics; never forward fixture tokens or backend values into application logs.
  child.stdout.resume(); child.stderr.resume();
  async function close() {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    await Promise.race([new Promise(resolve => child.exitCode !== null ? resolve() : child.once('exit', resolve)), delay(5000)]);
    try { process.kill(-child.pid, 'SIGKILL'); } catch {}
    await rm(directory, { recursive: true, force: true });
  }
  try {
    for (let n = 0; n < 600; n++) {
      if (failure || child.exitCode !== null) throw new Error('Synthetic backend startup failed.');
      try {
        const config = JSON.parse(await readFile(ready, 'utf8'));
        if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(config.base) || !config.syntheticOnly || config.providerBeans !== false)
          throw new Error('Invalid synthetic backend.');
        return { ...config, close, async reads() {
          try { return (await readFile(join(directory, 'requests.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse); }
          catch (error) { if (error.code === 'ENOENT') return []; throw error; }
        } };
      } catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
      await delay(100);
    }
    throw new Error('Synthetic backend startup timeout.');
  } catch (error) { await close(); throw error; }
}
