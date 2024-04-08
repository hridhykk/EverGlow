const User=require('../models/userModel');

const isblocked = async (req,res,next)=>{
  try{
    const user = await User.findById(req.session.user_id);
    if(user){
      if(req.session.isblocked===user.isBlocked){
        next()
       }else{
        delete req.session.user_id;
       res.redirect('/login')
        }
      }else{
        res.redirect('/login')
      }
    }
   
  
  catch(error){
    console.log(error.message)
  }
}

module.exports = {
  isblocked
}
  
