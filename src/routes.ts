import express from 'express';
import multer from 'multer';
import { celebrate, Joi, Segments } from 'celebrate';

import { join } from 'path';
import UsersController from './controllers/UsersController';
import SessionsController from './controllers/SessionsController';
import CarsController from './controllers/CarsController';
import CarImagesController from './controllers/CarImagesController';
import SpecsController from './controllers/SpecsController';
import RentalsController from './controllers/RentalsController';

import ensureAuthentication from './middlewares/ensureAuthentication';

import uploadConfig from './config/upload';

const usersController = new UsersController();
const sessionsController = new SessionsController();
const carsController = new CarsController();
const specsController = new SpecsController();
const rentalsController = new RentalsController();
const carImagesController = new CarImagesController();

const routes = express.Router();
const upload = multer(uploadConfig);

routes.post(
  '/users',
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    },
  }),
  usersController.create
);

routes.post(
  '/sessions',
  celebrate({
    [Segments.BODY]: {
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    },
  }),
  sessionsController.create
);

routes.use(ensureAuthentication);

routes.post(
  '/cars',
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().required(),
      brand: Joi.string().required(),
      daily_value: Joi.number().required(),
    },
  }),
  carsController.create
);

routes.post(
  '/cars/:id/images',
  upload.single('image'),
  carImagesController.store
);

routes.patch(
  '/cars',
  celebrate({
    [Segments.BODY]: {
      car: Joi.string().required(),
      brand: Joi.string().required(),
      daily_value: Joi.number().required(),
    },
  }),
  carsController.update
);

routes.get(
  '/cars',
  celebrate({
    [Segments.QUERY]: Joi.object({
      name: Joi.string(),
      start_date: Joi.string().isoDate(),
      end_date: Joi.string().isoDate(),
      start_price: Joi.number(),
      end_price: Joi.number(),
      fuel: Joi.string(),
      transmission: Joi.string(),
    })
      .and('start_date', 'end_date')
      .and('start_price', 'end_price', 'fuel', 'transmission')
      .without('name', [
        'start_date',
        'end_date',
        'start_price',
        'end_price',
        'fuel',
        'transmission',
      ]),
  }),
  carsController.index
);

routes.delete(
  '/cars/:id',
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().uuid().required(),
    },
  }),
  carsController.delete
);

routes.post(
  '/specs',
  celebrate({
    [Segments.BODY]: {
      car_id: Joi.string().uuid().required(),
      name: Joi.string().required(),
      description: Joi.string().required(),
      icon: Joi.string().required(),
    },
  }),
  specsController.create
);

routes.post(
  '/rentals',
  celebrate({
    [Segments.BODY]: {
      car_id: Joi.string().uuid().required(),
      start_date: Joi.date().required(),
      end_date: Joi.date().required(),
    },
  }),
  rentalsController.create
);

export default routes;
