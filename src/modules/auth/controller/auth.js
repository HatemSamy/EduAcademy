
import userModel from "../../../../DB/model/User.model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sendEmail } from "../../../services/email.js"
import { asynchandlier } from "../../../services/erroeHandling.js"
import { findOne } from "../../../../DB/DBMethods.js"


export const signup = asynchandlier(async (req, res, next) => {
  const { userName, email, password, phone } = req.body

  const user = await findOne({ filter: { email }, model: userModel, select: "email" })///name argument

  if (user) {
    return next(Error("user aready exist", { cause: 400 }))

  } else {
    const hash = bcrypt.hashSync(password, parseInt(process.env.SALTROUND))
    const newuser = new userModel({ userName, email, password: hash, phone })

    const token = jwt.sign({ id: newuser._id }, process.env.emailToken)
    const refreshtoken = jwt.sign({ id: newuser._id }, process.env.emailToken)

    const link = `${req.protocol}://${req.headers.host}${process.env.BASEURL}/auth/confirmEmail/${token}`

    const message = `<a href="${link}">confirmEmail<a/>`

    const info = await sendEmail(email, "confirmemail", message)
    if (info?.accepted?.length) {
      const savedUser = await newuser.save()
      res.status(201).json({ message: "Done", userId: savedUser._id })
      console.log(info?.accepted?.length);

    } else {
      return next(Error("email regicted", { cause: 404 }))

    }

  }
}
)


export const confirmEmail = asynchandlier(async (req, res) => {
  const { token } = req.params
  const decoded = jwt.verify(token, process.env.emailToken)
  if (!decoded?.id) {
    return next(Error("in-valid token payload", { cause: 400 }))

  } else {
    const user = await userModel.findOneAndUpdate({ _id: decoded.id, confirmEmail: false }, { confirmEmail: true })

    res.status(201).json({ message: "email confirmed" })

  }
})




export const login = asynchandlier(async (req, res, next) => {
  const { email, password } = req.body

  const user = await userModel.findOne({ email })
  if (!user) {
    return next(Error("user not register", { cause: 404 }))

  } else {
    if (!user.confirmEmail) {
      return next(Error("confirm your email frist", { cause: 403 }))

    } else {
      const match = bcrypt.compareSync(password, user.password)
      if (!match) {
        return next(Error("in-valid password", { cause: 404 }))

      } else {

        const token = jwt.sign({ id: user._id, isloggedin: true, userName: user.userName }, process.env.tokenSignature)

        return res.status(200).json({ message: "login success", token })

      }

    }

  }

})


export const sendAccessCode = async (req, res, next) => {

  const { email } = req.body
  const user = await userModel.findOne({ email })
  if (!user) {
    return next(new Error(" in-valid account", { casue: 404 }))

  } else {
    const AccessCode = Math.floor(1000 + Math.random() * 9000);
    const code = await userModel.findOneAndUpdate({ email }, { accessCode: AccessCode })
    const massage = `
    <h1>${AccessCode}</h1>
    `
    await sendEmail(user.email, "Reset password", massage)

    return res.status(200).json({ message: "Done Check your Email", AccessCode });

  }
}


export const forgetPassword = async (req, res, next) => {
  const { Newpassword, email, Code } = req.body
  const user = await userModel.findOne({ email, accessCode: Code })
  if (!user) {
    return next(new Error(" in valid account", { casue: 409 }))

  } else {
    const hash = bcrypt.hashSync(Newpassword, parseInt(process.env.SALTROUND))
    const updatePassword = await userModel.updateOne({ email }, { password: hash, accessCode: '' })
    return res.status(201).json({ message: "password updated seccessfully" });

  }


}




