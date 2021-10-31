canvas.tokens.releaseAll()
canvas.tokens.placeables.filter(x => x.actor.hasPlayerOwner).forEach(x => x.control({ releaseOthers: false }))
