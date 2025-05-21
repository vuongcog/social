
function getValue() {
  return Promise.reject(42);

}

 const test = async ()=> {
    try {
       const a = await getValue();
        // console.log(a)
    } catch (error) {
        console.log(error)
    }

}

// try {
//   throw Error("adasd")
// } catch (error) {
//   console.log("hello")
//   throw ("adasd")
// }

console.log("Thông tin bình thường");
console.error("Đây là lỗi");