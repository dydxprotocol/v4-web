// https://www.quora.com/Why-cant-console-log-be-assigned-to-a-variable
export function consoleLogger(...args) {
    console.log.call(this, ...args)
    return args[0]
}
