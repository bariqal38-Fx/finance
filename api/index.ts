import { MARKER } from './_helper';

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('content-type', 'text/plain');
  res.end('DIAG9_' + MARKER);
}
