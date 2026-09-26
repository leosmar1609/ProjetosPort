import serverless from 'serverless-http';
import app from '../../server/app.js';

// no Netlify o mesmo app Express roda como function
export const handler = serverless(app);
