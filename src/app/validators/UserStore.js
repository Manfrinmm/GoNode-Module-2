import * as Yup from "yup";

export default async (req, res, next) => {
  try {
    const schema = Yup.object().shape({
      name: Yup.string("O campo 'name' deve ser no formato de string").required(
        "O campo 'name' é obrigatório"
      ),
      email: Yup.string("O campo 'email' deve ser no formato de string")
        .required("O campo 'email' é obrigatório")
        .email("O campo 'email' deve ser em formato de e-mail"),
      password: Yup.string()
        .required("O campo 'password' é obrigatório")
        .min(2, "A senha deve conter no mínimo 2 dígitos")
    });

    await schema.validate(req.body, { abortEarly: false });

    return next();
  } catch (error) {
    return res.status(400).json({ message: error.errors });
  }
};
