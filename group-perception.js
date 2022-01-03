/**
 * @param {number} rank
 */
function skillRankToProficiency(rank) {
    switch (rank) {
        case 1:
            return 'trained'
        case 2:
            return 'expert'
        case 3:
            return 'master'
        case 4:
            return 'legendary'
        default:
            return 'untrained'
    }
}

/** @param {Token} token */
function rollPerception(token) {
    const perception = token.actor.data.data.attributes.perception
    const mod = perception.value
    const rank = skillRankToProficiency(perception.rank)
    const roll = new Roll('1d20 + @mod', { mod }).evaluate({ async: false })
    const die = roll.dice[0].total
    let result = `<div class="flexrow"><span>${token.actor.name} (${rank})</span><span class="flex0"`
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
