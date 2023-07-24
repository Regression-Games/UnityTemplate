/**
 * Configure your bot instance.
 * See our [API Documentation]{@link http://www.todo.com} for available configuration options and values.
 */
export function configureBot(rg) {
    rg.isSpawnable = true;
    rg.lifecycle = "MANAGED";
    rg.characterConfig = { 
        // fill in custom keys + values to help seat and spawn your bot
    };
}

// Important: Choose one of the following methods to implement one of two types of Bots, and remove the remaining method.
// Sample code is provided to demonstrate how your implementation may differ depending on the type of Bot you'd like to create.
// Due to the flexibility of our Unity Integration and JavaScript API, sample code is not expected to run with your game out-of-the-box.

/**
 * Implement your code here to define a [PlayTest Bot]{@link http://www.todo.com}.
 * This method is invoked once each time your Unity integration collects updated state information for your GameObjects.
 * Add your code here to make dynamic decisions based on the current game state.
 * 
 * @param rg Exposes the [Regression Games API]{@link http://www.todo.com} which contains methods for evaluating the game state and queueing behaviors that you've defined as `RGActions`.
 */
export async function processTick(rg) {

    // if we're not on the correct Unity scene, then don't do anything yet
    if(rg.getState().sceneName !== "MyScene") return;

    // if the Bot needs a weapon, then search for locked chests nearby
    const bot = rg.getBot();
    if(await rg.entityHasAttribute(bot, ["equipment", "mainHand"], null)) {
        const chest = await rg.findNearestEntity("Chest", (chest) => { return chest.locked });
        if(chest) {
            // if we found one, then loot its contents
            rg.performAction("PickLock", {
                targetId: chest.id,
                position: chest.position
            });
            rg.performAction("LootChest", {
                targetId: chest.id,
                position: chest.position,
                // only loot specific types of items
                itemCategories: ["weapons", "potions"] 
            });
        }
    }
    else if(await rg.entityHasAttribute(bot, "hidden", false)) {
        // otherwise, hide in the shadows if we're not already hidden
        rg.performAction("Sneak");
    }
}

/**
 * Implement your code here to define a [Validation Bot]{@link http://www.todo.com}.
 * This method is invoked once and runs to completion. The scenario will fail if any assertion fails.
 * Add your code here to perform step-by-step actions and validate their effects on other GameObjects the game state.
 * 
 * @param rg Exposes the [Regression Games API]{@link http://www.todo.com} which contains methods for evaluating the game state and queueing behaviors that you've defined as `RGActions`.
 */
export async function startScenario(rg) {

    // wait until we're on the correct Unity scene
    await rg.waitForScene("MyScene");

    // find the closest lootable chest and open it
    const chest = await rg.findNearestEntity("Chest");
    await rg.entityHasAttribute(chest, "locked", true);

    // first, unlock it
    rg.performAction("PickLock", {
        targetId: chest.id,
        position: chest.position
    });
    await rg.entityHasAttribute(chest, "locked", false);

    // then take its items
    rg.performAction("LootChest", {
        targetId: chest.id,
        position: chest.position,
        items: ["sword", "potion"]
    });

    // validate that our bot has the looted items in its inventory
    const bot = rg.getBot();
    await rg.entityHasAttribute(bot, ["equipment", "mainHand"], "sword");
    await rg.entityHasAttribute(bot, ["equipment", "hotBar", "slot1"], "potion");
    
    // hide in the shadows
    rg.performAction("Sneak");
    await rg.entityHasAttribute(bot, "hidden", true)

    // finished!
    rg.complete();
}