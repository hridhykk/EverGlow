const logSession = (req,res,next)=>{
  if(req.session.user_id){
    next()
  } else {
     res.redirect('/login')
  }
}

const isLogout=async(req,res,next)=>{
  try{
  if(req.session.user_id){
          res.redirect('/home');
      }
      else{
          next();
      }
      
  }
  catch(error){
      console.log(error.message);

  }
}










module.exports = {
  logSession,isLogout
}
  
