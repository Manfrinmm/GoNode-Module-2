import { isBefore, subHours } from "date-fns";

import User from "../models/User";
import Appointment from "../models/Appointment";

import Queue from "../../lib/Queue";
import CancellationMail from "../jobs/CancellationMail";

import Cache from "../../lib/Cache";

class CancelAppointmentService {
  async run({ provider_id, userId }) {
    const appointment = await Appointment.findByPk(provider_id, {
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

    if (appointment.user_id !== userId) {
      throw new Error("Você não tem permissão para cancelar este agendamento");
    }

    //remove duas horas do horario de agendamento
    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      throw new Error(
        "Você só pode cancelar agendamentos com duas horas de antecedência."
      );
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Queue.add(CancellationMail.key, {
      appointment
    });

    // Invalidar o cache
    await Cache.invalidatePrefix(`user:${userId}:appointments`);

    return appointment;
  }
}

export default new CancelAppointmentService();
