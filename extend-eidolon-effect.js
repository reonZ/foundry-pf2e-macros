const nbTokens = canvas.tokens.controlled.length

if (nbTokens === 0) {
    ui.notifications.warn('You must have a token selected.')
    return
} else if (nbTokens > 1) {
    ui.notifications.warn('Only one token can be selected.')
    return
}

const effects = actor.itemTypes.effect.filter(x => x.slug?.startsWith('spell-effect-boost-eidolon') || x.slug === 'spell-effect-reinforce-eidolon')

if (effects.length === 0) {
    ui.notifications.warn('Creature does not have any eidolon effect.')
    return
}

function getEffectName(effect) {
    if (effect.name.includes('Boost Eidolon')) return 'Boost Eidolon'
    else return 'Reinforce Eidolon'
}

function extend($html) {
    const index = Number($html.find('[name="effect"]:checked').val()) || 0
    const rounds = Number($html.find('[name="rounds"]:checked').val())
    const effect = effects[index]
    token.actor.updateEmbeddedDocuments('Item', [{ _id: effect.id, 'data.duration.value': rounds }])
}

const buttons = {
    yes: {
        icon: `<i class="fas fa-bolt"></i>`,
        label: 'Extend',
        callback: extend,
    },
    no: {
        icon: `<i class="fas fa-times"></i>`,
        label: 'Cancel',
    },
}

let content = ''

if (effects.length === 1) {
    content += `<div>${getEffectName(effects[0])}</div>`
} else {
    for (let i = 0; i < effects.length; i++) {
        content += `<div><input type="radio" name="effect" value="${i}" ${i === 0 ? 'checked' : ''} /> ${getEffectName(effects[i])}</div>`
    }
    content += '<hr/>'
}

content += '<div><input type="radio" name="rounds" value="3" checked /> 3 rounds</div>'
content += '<div style="margin-bottom: 8px;"><input type="radio" name="rounds" value="4" /> 4 rounds</div>'

let dialog = new Dialog({
    title: 'Extend Eidolon Effect',
    content,
    buttons,
    default: 'yes',
})

dialog.render(true)
