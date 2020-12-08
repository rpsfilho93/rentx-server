import { errors } from 'celebrate';
import express from 'express';
import routes from './routes';

const app = express();

app.use(express.json());

app.use(routes);

app.use(errors());

app.listen(3333);
