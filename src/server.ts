import { errors } from 'celebrate';
import express from 'express';
import routes from './routes';
import uploadConfig from './config/upload';

const app = express();

app.use(express.json());

app.use(routes);

app.use('/files', express.static(uploadConfig.uploadsFolder));

app.use(errors());

app.listen(3333);
