module.exports = function asyncErrorCatcher(fn) {  //펑션을 받아
  if (!(fn instanceof Function)) {  // 펑션을 실행
    throw new Error('Must supply a function');
  }

  return (req, res, next) => {
    const promise = fn(req, res, next);
    if (!promise.catch) return;
    promise.catch(err => next(err));  // 에러를 한 번에 글로벌로 싸놓음.
  };
};
