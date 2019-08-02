import User from "../models/User";
import File from "../models/File";
import Appointments from "../models/Appointments";
import Notification from "../schemas/Notification";

import { startOfHour, parseISO, isBefore, format, subHours } from "date-fns";
import pt from "date-fns/locale/pt";
import * as Yup from "yup";

import CancellationMail from "../jobs/CancellationMail";
import Queue from "../../lib/Queue";

class AppointmentsController {
  async index(req, res) {
    const { page } = req.query;

    const appointments = await Appointments.findAll({
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
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required()
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ message: "Falha na validação" });

    var user = await User.findByPk(req.body.provider_id);

    if (!user)
      return res.status(404).json({ message: "Usuario não encontrado" });

    if (!user.provider)
      return res
        .status(401)
        .json({ message: "Provider fornecido não é um provider" });

    //faz com que a hora passada no body fique em horario fechado
    const hourStart = startOfHour(parseISO(req.body.date));

    if (isBefore(hourStart, new Date()))
      return res.status(400).json({ message: "Data invalida" });

    const { provider_id } = req.body;
    const checkAvailability = await Appointments.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart
      }
    });

    if (checkAvailability)
      return res.status(400).json({ message: "Data invalida, já ocupado" });

    const appointment = await Appointments.create({
      ...req.body,
      user_id: req.userId
    });

    //notificação do serviço para o provider
    user = await User.findByPk(req.userId);
    const formattedDate = format(hourStart, "dd' de 'MMMM', às 'H:mm'h'", {
      locale: pt
    });

    await Notification.create({
      content: `Novo agendamento de ${user.name} para dia ${formattedDate}`,
      user: provider_id
    });
    return res.status(201).json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointments.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "provider",
          attributes: ["name", "email"]
        },
        {
          model: User,
          as: "user",
          attributes: ["name"]
        }
      ]
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "Você não tem permissão para cancelar este agendamento"
      });
    }

    //remove duas horas do horario de agendamento
    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error:
          "Você só pode cancelar agendamentos com duas horas de antecedência."
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    Queue.add(CancellationMail.key, {
      appointment
    });

    return res.json(appointment);
  }
}

export default new AppointmentsController();
