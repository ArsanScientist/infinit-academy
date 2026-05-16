const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { initDb, prepare } = require('./db');

async function seed() {
  await initDb();
  console.log('🌱 Seeding...');

  if (!prepare("SELECT id FROM users WHERE email='admin@infinit.edu'").get()) {
    prepare('INSERT INTO users(id,name,email,password,role) VALUES(?,?,?,?,?)').run(uuid(),'Admin','admin@infinit.edu',bcrypt.hashSync('admin1234',10),'admin');
    console.log('✓ Admin: admin@infinit.edu / admin1234');
  }

  const settings = { site_name:'infiniT', slogan:'T for Turag, T for Top in Physics', contact_email:'turag@infinit.edu' };
  for(const [k,v] of Object.entries(settings))
    prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(k,v);
  console.log('✓ Settings');

  if (!prepare('SELECT id FROM teacher WHERE id=1').get()) {
    prepare('INSERT INTO teacher(id,name,title,institution,qualification,bio,photo) VALUES(?,?,?,?,?,?,?)').run(
      1,'MD. Turag Hossain','Physics Teacher','Mirpur Cantonment Public School and College',
      'B.Sc. EEE — BUET','Passionate physics educator with BUET background.',null);
    console.log('✓ Teacher');
  }

  if (!prepare('SELECT COUNT(*) c FROM batches').get().c) {
    const ins = prepare('INSERT INTO batches(id,name,subtitle,tag,schedule,location,room,start_date,total_seats,enrolled,status,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
    ins.run(uuid(),'Batch Alpha','Higher Secondary Physics','HSC · 2026','Sat,Mon,Wed — 4:00 PM','Mirpur Cantonment School','Room 101','February 2026',30,18,'open',0);
    ins.run(uuid(),'Batch Beta','Secondary Physics — Core & Advanced','SSC · 2026','Fri & Sun — 5:00 PM','Mirpur Cantonment School','Room 203','March 2026',25,17,'open',1);
    ins.run(uuid(),'Batch Gamma','Engineering Admission Crash','Admission · Special','Tue & Thu — 6:30 PM','Mirpur Cantonment School','Room 305','April 2026',20,17,'open',2);
    console.log('✓ Batches');
  }

  if (!prepare('SELECT COUNT(*) c FROM gallery').get().c) {
    const ins = prepare('INSERT INTO gallery(id,url,caption,sort_order) VALUES(?,?,?,?)');
    ins.run(uuid(),'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800','The Learning Space',0);
    ins.run(uuid(),'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800','Focused Study',1);
    ins.run(uuid(),'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800','Physics in Motion',2);
    console.log('✓ Gallery');
  }

  if (!prepare('SELECT COUNT(*) c FROM testimonials').get().c) {
    const ins = prepare('INSERT INTO testimonials(id,name,result,text,sort_order) VALUES(?,?,?,?,?)');
    ins.run(uuid(),'Rahim Ahmed','GPA 5.0 — HSC 2025','Turag Sir changed how I understand physics completely.',0);
    ins.run(uuid(),'Fatima Khatun','BUET Admission 2025','Got into BUET EEE thanks to the admission batch!',1);
    ins.run(uuid(),'Sakib Hassan','GPA 5.0 — SSC 2025','Turag Sir makes physics feel like magic.',2);
    console.log('✓ Testimonials');
  }

  console.log('\n✅ Seed complete! Admin: admin@infinit.edu / admin1234\n');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
