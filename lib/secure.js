// @flow

import crypto from 'crypto';

export const secret: string = 'abcdefg';

export const encrypt = (value: string): string => crypto.createHmac('sha256', secret)
  .update(value)
  .digest('hex');
