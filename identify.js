/** @typedef {foundry.data.ItemData} ItemData */
/** @typedef {'incredibly easy'|'very easy'|'easy'|'normal'} NegativeDCAdjustment */
/** @typedef {'normal'|'hard'|'very hard'|'incredibly hard'} PositiveDCAdjustment */
/** @typedef {NegativeDCAdjustment|PositiveDCAdjustment} DCAdjustment */

const localize = game.i18n.localize.bind(game.i18n)
const notMatchingTraditionModifier = /** @type {number} */ (game.settings.get('pf2e', 'identifyMagicNotMatchingTraditionModifier'))
const proficiencyWithoutLevel = game.settings.get('pf2e', 'proficiencyVariant') === 'ProficiencyWithoutLevel'

const RARITIES = ['common', 'uncommon', 'rare', 'unique']

/** @typedef {typeof RARITIES[number]} Rarity */

/** @type {Map<number, number>} */
const dcByLevel = new Map([
    [-1, 13],
    [0, 14],
    [1, 15],
    [2, 16],
    [3, 18],
    [4, 19],
    [5, 20],
    [6, 22],
    [7, 23],
    [8, 24],
    [9, 26],
    [10, 27],
    [11, 28],
    [12, 30],
    [13, 31],
    [14, 32],
    [15, 34],
    [16, 35],
    [17, 36],
    [18, 38],
    [19, 39],
    [20, 40],
    [21, 42],
    [22, 44],
    [23, 46],
    [24, 48],
    [25, 50],
])

const MAGIC_TRADITIONS = ['arcane', 'primal', 'divine', 'occult']

/** @typedef {typeof MAGIC_TRADITIONS[number]} MagicTradition */

/** @type {Set<string>} */
const magicTraditions = new Set(MAGIC_TRADITIONS)

/** @type {Map<DCAdjustment, number>} */
const dcAdjustments = new Map([
    ['incredibly easy', -10],
    ['very easy', -5],
    ['easy', -2],
    ['normal', 0],
    ['hard', 2],
    ['very hard', 5],
    ['incredibly hard', 10],
])

/** @type {Item[]} */
const items = game.actors.reduce((items, actor) => {
    if (actor.hasPlayerOwner) items.push(...actor.items.filter(item => item.isIdentified === false))
    return items
}, /** @type {Item[]} */ ([]))

// @ts-ignore
const buttons = {
    ok: {
        icon: '<i class="fas fa-times"></i>',
        label: 'Close',
    },
}

function getContent() {
    let content = `
    <div style="text-align: center; margin-bottom: 4px;">
        <input type="radio" name="remove" value="remove">
        <label style="margin-right: 4px;">Remove from list</label>
        <input type="radio" name="remove" value="recheck" checked>
        <label>Remove for the day</label>
        <a data-type="reset" style="margin-left: 10px;" title="Reset Day"><i class="fas fa-redo-alt"></i></a>
    </div>
    <div class="flexcol" style="margin-bottom: 8px;">
    `

    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.getFlag('world', 'identify.checked')) continue
        const identified = item.data.data.identification.identified
        content += `
    <div data-type="item" class="flexrow" style="padding: 4px 6px; border-radius: 2px; align-items: center; gap: 4px;" 
            onmouseover="this.style.backgroundColor='#0000001f';" 
            onmouseout="this.style.backgroundColor='transparent';"> 
        <div class="flex0" 
        style="background: center / contain no-repeat url(${identified.img}); padding: 12px; box-shadow: inset 0 0 0 1px var(--tertiary);"></div>
        <div>${identified.name}</div>
        <div style="display: flex; flex-grow: 0; gap: 6px; font-size: 20px;">
            <a title="Post skill checks" data-type="checks" data-index="${i}"><i class="fas fa-dice-d20"></i></a>
            <a title="Identify Item" data-type="identify" data-index="${i}"><i class="fas fa-question-circle"></i></a>
            <a title="Remove from list" data-type="remove" data-index="${i}"><i class="fas fa-trash"></i></a>
        </div>
    </div>
    `
    }

    content += '</div>'

    return content
}

/**
 *
 * @param {Rarity} rarity
 * @returns {PositiveDCAdjustment}
 */
function rarityToDCAdjustment(rarity = 'common') {
    if (rarity === 'uncommon') return 'hard'
    else if (rarity === 'rare') return 'very hard'
    else if (rarity === 'unique') return 'incredibly hard'
    else return 'normal'
}

/**
 * @param {number} dc
 * @param {DCAdjustment} adjustment
 * @returns number
 */
function adjustDC(dc, adjustment = 'normal') {
    return dc + (dcAdjustments.get(adjustment) ?? 0)
}

/**
 * @param {number} dc
 * @param {Rarity} rarity
 * @returns number
 */
function adjustDCByRarity(dc, rarity = 'common') {
    return adjustDC(dc, rarityToDCAdjustment(rarity))
}

/**
 * @param {number} level
 * @param {Rarity} [rarity]
 * @returns
 */
function getDc(level, rarity = 'common') {
    const dc = dcByLevel.get(level) ?? 14
    if (proficiencyWithoutLevel) return adjustDCByRarity(dc - Math.max(level, 0), rarity)
    else return adjustDCByRarity(dc, rarity)
}

/**
 * @param {ItemData} itemData
 * @returns {Set<string>}
 */
function getTraits(itemData) {
    return new Set(itemData.data.traits.value)
}

/**
 * @param {ItemData} itemData
 * @returns {boolean}
 */
function isCursed(itemData) {
    return getTraits(itemData).has('cursed')
}

/**
 * @param {ItemData} itemData
 * @returns {Rarity}
 */
function getDcRarity(itemData) {
    if (isCursed(itemData)) return 'unique'
    else return itemData.data.traits.rarity?.value ?? 'common'
}

/**
 * @param {ItemData} itemData
 * @returns {Set<MagicTradition>}
 */
function getMagicTraditions(itemData) {
    const traits = getTraits(itemData)
    return new Set([...traits].filter(trait => magicTraditions.has(trait)))
}

/**
 * @param {string} skill
 * @param {number} value
 */
function templateData(skill, value) {
    return {
        description: localize(`PF2E.${skill}`),
        get skill() {
            return this.description.toLowerCase()
        },
        DC: value,
    }
}

/**
 * @param {ItemData} itemData
 * @param {number} baseDc
 */
function identifyMagic(itemData, baseDc) {
    const result = {
        occult: baseDc,
        primal: baseDc,
        divine: baseDc,
        arcane: baseDc,
    }
    const traditions = getMagicTraditions(itemData)
    for (const key of MAGIC_TRADITIONS) {
        if (traditions.size > 0 && !traditions.has(key)) {
            result[key] = baseDc + notMatchingTraditionModifier
        }
    }
    return [
        templateData('SkillArcana', result.arcane),
        templateData('SkillNature', result.primal),
        templateData('SkillOccultism', result.occult),
        templateData('SkillReligion', result.divine),
    ]
}

/**
 * @param {Item} item
 */
function identifyItem(item) {
    const dc = getDc(item.level)
    const rarity = getDcRarity(item.data)
    const baseDc = adjustDCByRarity(dc, rarity)
    if (item.isMagical) return identifyMagic(item.data, baseDc)
    else return [templateData('SkillCrafting', baseDc)]
}

/**
 * @param {JQuery.TriggeredEvent<any, any, HTMLAnchorElement>} event
 */
function postChecks(event) {
    const index = event.currentTarget.dataset.index
    const item = items[index]
    const skillArray = identifyItem(item)
    const itemImg = item.data.data.identification.unidentified.img
    const itemName = item.data.data.identification.unidentified.name
    const identifiedName = item.data.data.identification.identified.name

    renderTemplate('systems/pf2e/templates/actors/identify-item-chat-skill-checks.html', {
        itemImg,
        itemName,
        identifiedName,
        skillArray,
    }).then(template => {
        ChatMessage.create({
            user: game.user.id,
            content: template,
        })
    })
}

/**
 * @param {JQuery.TriggeredEvent<any, any, HTMLAnchorElement>} event
 */
async function identify(event) {
    const index = event.currentTarget.dataset.index
    await items[index].setIdentificationStatus('identified')
    await remove(event, true)
}

// @ts-ignore
let dialog
function createDialog() {
    dialog = new Dialog({
        title: 'Identify Items',
        content: getContent(),
        buttons,
        render: onRender,
    })
    dialog.render(true)
}

/**
 * @param {JQuery.TriggeredEvent<any, any, HTMLAnchorElement>} event
 * @param {boolean} [noRecheck]
 */
async function remove(event, noRecheck) {
    const target = event.currentTarget
    if (!noRecheck) {
        const remove = event.delegateTarget.querySelector('[name="remove"]:checked').value
        if (remove === 'recheck') {
            const index = target.dataset.index
            const item = items[index]
            await item.setFlag('world', 'identify.checked', true)
        }
    }
    target.closest('[data-type="item"]').remove()
}

async function reset() {
    const confirm = await Dialog.confirm({
        title: 'Reset Day',
        content: 'All the items that were removed for the day will appear once again in the list.',
        defaultYes: true,
    })
    if (!confirm) return
    for (const item of items) await item.unsetFlag('world', 'identify.checked')
    dialog?.close()
    createDialog()
}

/**
 * @param {JQuery} $html
 */
function onRender($html) {
    $html.filter('.dialog-buttons').css('flex-grow', 0)
    $html.on('click', '[data-type="checks"]', postChecks)
    $html.on('click', '[data-type="identify"]', identify)
    $html.on('click', '[data-type="remove"]', remove)
    $html.on('click', '[data-type="reset"]', reset)
}

createDialog()
