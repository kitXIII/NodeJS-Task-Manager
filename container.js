import dotenv from 'dotenv';
import getLogger from './lib/logger';
import secure from './lib/secure';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const logger = getLogger(env);

export default { logger, secure };
