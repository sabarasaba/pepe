const Sequelize = require('sequelize')
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'test.sqlite' });

const User = sequelize.define('users', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING
  }
});

const Context = sequelize.define('contexts', {
  id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
  },
  role: {
      type: Sequelize.STRING,
  }
});

const Apartment = sequelize.define('apartments', {
  id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
  },
  floor: {
      type: Sequelize.STRING,
  }
});

const Building = sequelize.define('buildings', {
  id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
  },
});

User.hasMany(Context, { foreignKey: 'user_id', sourceKey: 'id' });
Context.belongsTo(User, { foreignKey: 'id' });

Building.hasMany(Context, { foreignKey: 'id', sourceKey: 'building_id' });
Context.belongsTo(Building, { foreignKey: 'building_id' });

Building.hasMany(Apartment, { foreignKey: 'building_id', sourceKey: 'id' });
Apartment.belongsTo(Building, { foreignKey: 'id' });

Apartment.hasMany(Context, { foreignKey: 'id', sourceKey: 'apartment_id' });
Context.belongsTo(Apartment, { foreignKey: 'apartment_id' });

// The way this goes is that:
//  * A building has many apartments
//  * A user has many contexts
//  * Each context is asociated to either an apartment or a building

/*
 Query I need to generate is this query exactly:

  SELECT
    B.name,
    COUNT(A.id) as apartments,
    COUNT(U.id) as users
  FROM public.buildings as B
  LEFT JOIN public.apartments as A ON A.building_id = B.id
  LEFT JOIN public.contexts as C on C.building_id = B.id
  LEFT JOIN public.users as U on U.id = C.user_id
  GROUP BY B.id;


  But im having problems with the LEFT JOINS for contexts and users
*/

sequelize.sync({ force: true })
  .then(() => Building.create({ id: 1, name: 'tower 01' }))
  .then(() => Building.create({ id: 2, name: 'tower 02' }))
  .then(() => Apartment.create({ id: 1, floor: '3ro B', 'building_id': 1 }))
  .then(() => Apartment.create({ id: 2, floor: '5to F', 'building_id': 1 }))
  .then(() => Apartment.create({ id: 3, floor: 'pbb', 'building_id': 2 }))
  .then(() => User.create({ id: 1, name: 'pepe gomez' }))
  .then(() => User.create({ id: 2, name: 'ramon alvaro picolino' }))
  .then(() => Context.create({ id: 1, role: 'admin', 'user_id': 1, 'building_id': 1 }))
  .then(() => Context.create({ id: 2, role: 'tenant', 'user_id': 1, 'apartment_id': 1 }))
  .then(() => Building.findAll({
    attributes: [
      'name',
      [sequelize.fn('COUNT', sequelize.col('apartments.id')), 'apartments'],
      // [sequelize.fn('COUNT', sequelize.col('users.id')), 'users']
    ],
    include: [
      {
        model: Apartment,
        as: 'apartments',
        attributes: []
      },
    ],
    group: ['buildings.id']
  }))
  .then(tasks => console.log(JSON.stringify(tasks, undefined, 2)));
