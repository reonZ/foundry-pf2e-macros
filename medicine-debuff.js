let actors = canvas.tokens.controlled.map(x => x.actor)
if (!actors.length) {
    if (!game.user.character) {
        ui.notifications.warn('You must select an actor.')
        return
    }
    actors = [game.user.character]
}

const playerActors = game.actors.filter(x => x.hasPlayerOwner)

const debuffs = [
    { name: 'Treat Wounds', duration: { value: 50, unit: 'minutes' } },
    { name: 'Battle Medicine', duration: { value: 1, unit: 'days' }, singleActor: true },
]

function isDebuffDisabled(i) {
    return debuffs[i].singleActor && actors.length > 1
}

let toCheck = 0
function isDebuffChecked(i) {
    if (i > toCheck) return false
    if (isDebuffDisabled(i)) {
        toCheck++
        return false
    }
    return true
}

async function apply($html) {
    const sourceId = $html.find('[name="source"]:checked').val()
    const debuffIndex = Number($html.find('[name="debuff"]:checked').val())

    const sourceActor = playerActors.find(x => x.id === sourceId)
    const debuff = debuffs[debuffIndex]

    const effect = {
        type: 'effect',
        img: 'icons/svg/degen.svg',
        name: `${debuff.name} Debuff: ${sourceActor.name}`,
        data: {
            duration: { ...debuff.duration },
            description: {
                value: `<p>This creature can not receive the effects of '${debuff.name}' anymore from '${sourceActor.name}' for the duration.</p>`,
            },
        },
    }

    for (const actor of actors) {
        await Item.create([effect], { parent: actor })
    }
}

const buttons = {
    yes: {
        icon: `<i class="fas fa-heartbeat"></i>`,
        label: 'Apply',
        callback: apply,
    },
    no: {
        icon: `<i class="fas fa-times"></i>`,
        label: 'Cancel',
    },
}

let content = '<p>Source of the debuff:</p>'

for (let i = 0; i < playerActors.length; i++) {
    const actor = playerActors[i]
    content += `<div><input type="radio" name="source" value="${actor.id}" ${i === 0 ? 'checked' : ''} /> ${actor.name}</div>`
}

content += '<p>Debuff:</p>'

for (let i = 0; i < debuffs.length; i++) {
    const debuff = debuffs[i]
    const duration = debuff.duration
    const txt = `${debuff.name} - ${duration.value} ${duration.value > 1 ? duration.unit : duration.unit.slice(0, -1)}`
    content += `<div>${isDebuffDisabled(i) ? '<s>' : ''}<input type="radio" name="debuff" value="${i}"`
    content += ` ${isDebuffChecked(i) ? 'checked' : ''} ${debuff.singleActor && actors.length > 1 ? 'disabled' : ''} />`
    content += ` ${txt}</div>${isDebuffDisabled(i) ? '</s>' : ''}</div>`
}

content += '<br/>'

const dialog = new Dialog({
    title: 'Medicine Debuff',
    content,
    buttons,
    default: 'yes',
})

dialog.render(true)
