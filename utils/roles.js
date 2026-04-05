//https://www.reddit.com/r/javascript/comments/9tv3yd/exporting_objectfreeze_vs_const/

const roles = {
    ORGANIZER: "ORGANIZER",
    ATTENDEE: "ATTENDEE",
}

export const Role = Object.freeze(roles);