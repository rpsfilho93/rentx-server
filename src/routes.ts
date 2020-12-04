import express from 'express';
import UsersController from './controllers/UsersController';


const usersController = new UsersController();

const routes = express.Router();

routes.post('/users', usersController.create);

export default routes;
