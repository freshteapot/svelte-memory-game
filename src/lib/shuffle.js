import { copyObject } from "./utils.js"

const shuffle = function (arr) {

    let newArr = [...arr];
    newArr.push(...arr.map(item => {
        return copyObject(item);
    }))

    for (let i = newArr.length; i; i -= 1) {
        let j = Math.floor(Math.random() * i);
        let x = newArr[i - 1];
        newArr[i - 1] = newArr[j];
        newArr[j] = x;
    }
    return newArr;
};

export {
    shuffle
}
