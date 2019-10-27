import { startOfHour, parseISO, isBefore, format, subHours } from "date-fns";
import pt from "date-fns/locale/pt";

import User from "../models/User";
import Appointment from "../models/Appointment";

import Notification from "../schemas/Notification";

class CreateAppointmentService {
  async run({ provider_id, date, userId }) {
    var user = await User.findOne({
      where: { id: provider_id, provider: true }
    });

    if (!user) throw new Error("Provider fornecido inválido");

    //faz com que a hora passada no body fique em horario fechado: 8:30 -> 8:00
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) throw new Error("Data inválida");

    //verifica a disponibilidade
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart
      }
    });

    if (checkAvailability) throw new Error("Data inválida, já ocupado!");

    const appointment = await Appointment.create({
      date,
      user_id: userId
    });

    //notificação do serviço para o provider
    user = await User.findByPk(userId);

    const formattedDate = format(hourStart, "dd' de 'MMMM', às 'H:mm'h'", {
      locale: pt
    });

    await Notification.create({
      content: `Novo agendamento de ${user.name} para o dia ${formattedDate}`,
      user: provider_id
    });

    return appointment;
  }
}

export default new CreateAppointmentService();
