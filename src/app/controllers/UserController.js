import * as Yup from "yup";

import User from "../models/User";
import File from "../models/File";

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .required()
        .email(),
      password: Yup.string()
        .required()
        .min(2)
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: "Falha na validação" });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });
    if (userExists) return res.status(400).json({ error: "User já existente" });

    const { id, name, email, provider } = await User.create(req.body);

    return res.status(201).json({
      id,
      name,
      email,
      provider
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(3),
      password: Yup.string()
        .min(3)
        .when("oldPassword", (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when("password", (password, field) =>
        password ? field.required().oneOf([Yup.ref("password")]) : field
      )
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: "Falha na validação" });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    //troca de email
    if (email !== user.email) {
      const userExists = await User.findOne({
        where: { email }
      });

      if (userExists)
        return res.status(400).json({ error: "User já existente" });
    }

    //troca senha
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: "Senha inválida" });
    }

    await user.update(req.body);

    const { id, name, avatar } = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: "avatar",
          attributes: ["id", "path", "url"]
        }
      ]
    });

    return res.status(201).json({
      id,
      name,
      email,
      avatar
    });
  }
}

export default new UserController();
