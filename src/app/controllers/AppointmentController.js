import User from "../models/User";
import File from "../models/File";
import Appointment from "../models/Appointment";

import createAppointmentService from "../services/CreateAppointmentService";
import cancelAppointmentService from "../services/cancelAppointmentService";

class AppointmentsController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ["date"],
      limit: 20, //mostra 20 por pagina
      offset: (page - 1) * 20, //pula a pagina
      attributes: ["id", "date", "past", "cancelable"],
      include: [
        {
          model: User,
          as: "provider",
          attributes: ["id", "name"],
          include: [
            {
              model: File,
              as: "avatar",
              attributes: ["id", "path", "url"]
            }
          ]
        }
      ]
    });

    if (appointments) return res.status(200).json(appointments);
    return res.status(400).json({ message: "Você não é um provider" });
  }

  async store(req, res) {
    const { provider_id, date } = req.body;

    const appointment = await createAppointmentService.run({
      provider_id,
      date,
      userId: req.userId
    });

    return res.status(201).json(appointment);
  }

  async delete(req, res) {
    const appointment = await cancelAppointmentService.run({
      provider_id: req.params.id,
      userId: req.userId
    });

    return res.json(appointment);
  }
}

export default new AppointmentsController();
