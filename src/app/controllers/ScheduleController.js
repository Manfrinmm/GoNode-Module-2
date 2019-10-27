import User from "../models/User";
import File from "../models/File";
import Appointment from "../models/Appointment";

import { startOfDay, parseISO, endOfDay } from "date-fns";
import { Op } from "sequelize";

class SchedulerController {
  async index(req, res) {
    const checkUserProvider = User.findOne({
      where: {
        id: req.userId,
        provider: true
      }
    });

    if (!checkUserProvider) {
      return res.status(400).json({ message: "Você não é um provider" });
    }

    const parsedDate = parseISO(req.query.date);

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)]
        }
      },
      order: ["date"],
      attributes: ["id", "date"],
      include: [
        {
          model: User,
          as: "user",
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

    return res.status(200).json(appointments);
  }
}

export default new SchedulerController();
