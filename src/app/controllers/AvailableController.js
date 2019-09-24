import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter
} from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import Appointments from "../models/Appointments";
import { Op } from "sequelize";

class AvailableController {
  async index(req, res) {
    const { date, timezone, currentDate } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Data inválida" });
    }

    var searchDate = utcToZonedTime(Number(date), timezone);
    const timezone2 = utcToZonedTime(searchDate, "UTC");
    // searchDate = utcToZonedTime(searchDate, "UTC");
    console.log("searchDate");
    console.log(searchDate);
    console.log("date");
    console.log(new Date());
    // console.log(
    //   startOfDay(searchDate) + " data dasdsa d asdasd sd sa dsa das d"
    // );

    var searchDate = Number(date);
    searchDate = utcToZonedTime(searchDate, timezone);

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
          isAfter(Number(value), Number(currentDate)) &&
          !appointments.find(a => format(a.date, "HH:mm") === time)
      };
    });

    return res.json(available);
  }
}

export default new AvailableController();
