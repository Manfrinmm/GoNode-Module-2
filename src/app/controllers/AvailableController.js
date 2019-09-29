import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
  parseISO
} from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import Appointments from "../models/Appointments";
import { Op } from "sequelize";

class AvailableController {
  async index(req, res) {
    const { date, timezone } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Data inválida" });
    }
    const searchDate = utcToZonedTime(new Date(Number(date)), timezone);
    console.log("searchDate1");
    console.log(searchDate);

    const currentDate = Number(date); //searchDate;
    console.log("currentDate");
    console.log(currentDate);

    console.log("new Date()");
    console.log(new Date(Number(date)));

    const appointments = await Appointments.findAll({
      where: {
        provider_id: req.params.providerId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)]
        }
      }
    });

    const schedule = [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00"
    ];

    const available = schedule.map(time => {
      const [hour, minute] = time.split(":");
      const value = setSeconds(
        setMinutes(setHours(searchDate, hour), minute),
        0
      );
      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        available:
          isAfter(value, currentDate) &&
          !appointments.find(a => format(a.date, "HH:mm") === time)
      };
    });

    return res.json(available);
  }
}

export default new AvailableController();
