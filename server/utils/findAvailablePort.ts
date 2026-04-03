import net from 'net';

export async function findAvailablePort(startPort: number, maxAttempts = 100) {
  for (let port = startPort; port < startPort + maxAttempts; port += 1) {
    const isAvailable = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();

      tester.once('error', () => resolve(false));
      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });

      tester.listen(port, '0.0.0.0');
    });

    if (isAvailable) {
      return port;
    }
  }

  throw new Error(`No available port found starting from ${startPort}`);
}