/**
 * Intersect 2 or more arrays
 *
 * Returns a new array representing the intersection of arrays
 * You should not assume that keys are preserved

 * @param {...array}
 *
 * @returns {array}
 */
module.exports = function intersect() {

  // Convert the arguments special to an array
  var args = arguments;
  args     = Object.keys(args).map(function (key) {
    return args[key];
  });
  if (!args.length) { return []; }

  // Fetch the first argument & make sure it's an array
  var output = args.shift();
  if (!Array.isArray(output)) { return []; }
  output = output.slice();

  // Intersect it with all the other arguments
  // Also makes sure only arrays are used
  args.forEach(function (subject) {
    if (!Array.isArray(subject)) { return; }
    output = output.filter(function (entry) {
      return subject.indexOf(entry) >= 0;
    });
  });

  return output;
};
