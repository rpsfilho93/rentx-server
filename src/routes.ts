import express from "express";
import UsersController from "./controllers/UsersController";
import SessionsController from "./controllers/SessionsController";

const usersController = new UsersController();
const sessionsController = new SessionsController();

const routes = express.Router();

routes.post("/users", usersController.create);
routes.post("/sessions", sessionsController.create);

export default routes;
