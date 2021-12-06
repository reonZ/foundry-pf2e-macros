/** @param {Token} token */
function rollPerception(token) {
    const mod = token.actor.data.data.attributes.perception.value
    const roll = new Roll('1d20 + @mod', { mod }).evaluate({ async: false })
    const die = roll.dice[0].total
    let result = `<div class="flexrow"><span>${token.actor.name}</span><span class="flex0"`
    if (die == 20) result += ' style="color: green;"'
    else if (die == 1) result += ' style="color: red;"'
    return `${result}>${roll.total}</span></div>`
}

function groupPerception() {
    let result = '<hr>'
    canvas.tokens.placeables.filter(x => x.actor?.hasPlayerOwner).forEach(token => (result += rollPerception(token)))
    ChatMessage.create({ content: result, flavor: 'Group Perception Checks', whisper: [game.user.id] })
}

groupPerception()
