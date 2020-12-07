import express from 'express';
import multer from 'multer';

import UsersController from './controllers/UsersController';
import SessionsController from './controllers/SessionsController';
import CarsController from './controllers/CarsController';
import ensureAuthentication from './middlewares/ensureAuthentication';

import uploadConfig from './config/upload';

const usersController = new UsersController();
const sessionsController = new SessionsController();
const carsController = new CarsController();

const routes = express.Router();
const upload = multer(uploadConfig);

routes.post('/users', usersController.create);

routes.post('/sessions', sessionsController.create);

routes.use(ensureAuthentication);

routes.post('/cars', upload.single('image'), carsController.create);
routes.patch('/cars', carsController.update);
routes.get('/cars', carsController.index);
routes.delete('/cars', carsController.delete);

export default routes;
