function capitalizeWord(word) {
    let newWord = word.split('')
    newWord[0] = newWord[0].toUpperCase()
    return newWord.join('')
}

function capitalizeSentence(sentence) {
    let newSentence = sentence.split(' ')
    for (let i = 0; i < newSentence.length; i++) {
        newSentence[i] = capitalizeWord(newSentence[i])
    }
    return newSentence.join(' ')
}

function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    });
}

export { capitalizeWord, capitalizeSentence, uniq }