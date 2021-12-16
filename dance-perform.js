const actor = canvas.tokens.controlled[0]?.actor ?? game.user.character
if (!actor) {
    ui.notifications.warn('You must select an actor.')
    return
}

const options = actor.getRollOptions(["all", "skill-check", "action:perform"]);
options.push('dance')
// options.push('leading-dance')

const target = Array.from(game.user.targets)[0]?.actor;
const dc = target ? {value: target.data.data.saves.will.value + 10} : undefined;

actor.data.data.skills.prf.roll({event, dc, options})