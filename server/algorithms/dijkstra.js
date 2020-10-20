import Debug from 'debug'
const debug = Debug('ratp:algorithms:dijkstra')

export class Path {
  constructor (cost, node, moreinfo) {
    /** @member {Number} cost */
    this.cost = cost
    /** @member {Node} node */
    this.node = node
    // arbitrary field that you can add to debug your code
    /** @member {Object} moreinfo */
    this.moreinfo = moreinfo
  }
}

export class Node {
  /**
   * @param {String} name
   * @param {Object} stop
   * @param {Function} discover
   * @param {Path[]} paths
   */
  constructor (name, stop = {}, discover = () => {}, paths = []) {
    /** @member {Boolean} visited */
    this.visited = false
    /** @member {String} name */
    this.name = name
    /** @member {Array<Path>} paths */
    this.paths = paths
    /** @member {Number} distance */
    this.distance = Infinity
    /** @member {Node} visitedFrom */
    this.visitedFrom = null
    /** @member {Function} discover */
    this.discover = discover
    /** @member {Object} stop */
    this.stop = stop
    /** @member {Boolean} start */
    this.start = false
    /** @member {Boolean} end */
    this.end = false
  }

  /**
   * @param {Node} node
   * @param {Number} cost
   * @param {Object} [moreinfo]
   */
  addOrientedPath (node, cost, moreinfo) {
    const current = this.paths.findIndex(n => n.node === node)
    if (current !== -1) {
      this.paths.splice(current, 1)
    }
    this.paths.push(new Path(cost, node, moreinfo))
  }

  /**
   * @param {Node} node
   * @param {Function} cost
   */
  addNonOrientedPath (node, cost) {
    this.addOrientedPath(node, cost)
    node.addOrientedPath(this, cost)
  }

  /**
   * Calculates the new distance for each node
   * Already visited nodes shouldn't be updated
   * The {@link Node}s returned are the nodes which were never calculated before
   * @returns {Node[]}
   */
  calcNeighboursTentativeDistance () {
  }
}

export class Dijkstra {
  /**
   * Calculates the shortest path, and returns a list of nodes
   * that we need to go through to have the path
   * @param {Node} startNode
   * @param {Node} endNode
   * @returns {Promise<Node[]>}
   */
  static async shortestPathFirst (startNode, endNode) {
  }

  /**
   * Generates the path from an endNode to the startNode
   * it uses the `visitedFrom` property to navigate backwards
   * to the starting point
   * @param {Node} endNode
   * @returns {Node[]}
   */
  static generatePath (endNode) {
  }

  /**
   * Print the path like a linked list
   * @param {Node[]} listOfNodes
   */
  /* istanbul ignore next */
  static printPath (listOfNodes) {
    let out = ''
    for (const n of listOfNodes) {
      out += `(${n.name}, ${n.distance}) => `
    }
    out += 'x'
    debug(out)
  }
}
