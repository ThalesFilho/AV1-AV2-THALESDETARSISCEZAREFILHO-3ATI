import { AppError } from "../utils/AppError.js";

// Valida req.body / req.params / req.query com uma função de src/validators
// e guarda o resultado limpo em res.locals[source].
export const validate = (source, validator) => (req, res, next) => {
  const { value, errors } = validator(source === "body" ? req.body : req[source]);
  const fields = Object.keys(errors);
  if (fields.length > 0) {
    throw AppError.validation(errors[fields[0]][0], errors);
  }
  res.locals[source] = value;
  next();
};
