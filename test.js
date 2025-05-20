
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
test()