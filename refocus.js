let actors = canvas.tokens.controlled.map(x => x.actor)
if (!actors.length) {
    if (!game.user.character) {
        ui.notifications.warn('You must select an actor.')
        return
    }
    actors = [game.user.character]
}

const flavor =
    '<strong><img src="systems/pf2e/icons/actions/Passive.webp" width="10" height="10" style="border: 0; margin-right: 3px;">Refocus</strong>'
const content = 'Regains a focus point.'

async function message(actor) {
    const speaker = ChatMessage.getSpeaker(actor)
    await ChatMessage.create({ type: CONST.CHAT_MESSAGE_TYPES.EMOTE, speaker, flavor, content })
}

async function refocus() {
    for (const actor of actors) {
        const focus = actor.data.data.resources.focus
        const max = focus.max
        const value = focus.value
        if (!max || value >= max) return
        await actor.update({ 'data.resources.focus.value': value + 1 })
        await message(actor)
    }
}

const dialog = Dialog.confirm({
    title: 'Refocus',
    content: '<p>Are you sure you want to refocus ?</p>',
    yes: refocus,
    defaultYes: true,
})
