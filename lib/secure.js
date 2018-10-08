// @flow

import crypto from 'crypto';

const secret: string = process.env.ENCRYPT_SECRET;

const encrypt = (value: string): string => crypto.createHmac('sha256', secret)
  .update(value)
  .digest('hex');

export default encrypt;
