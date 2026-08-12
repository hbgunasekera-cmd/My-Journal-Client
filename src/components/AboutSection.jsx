import React from 'react';

const AboutSection = () => {
  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#334155',
    lineHeight: '1.7',
    fontSize: '15px'
  };

  const headerStyle = {
    marginBottom: '40px',
    borderLeft: '4px solid #3b82f6',
    paddingLeft: '16px'
  };

  const titleStyle = { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' };
  const subHeadingStyle = { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0' };
  const sectionStyle = { marginBottom: '40px' };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>My Journal — Sri Lanka Travel, Camping & Waterfall Exploration Diaries</h2>
        <p style={{ color: '#475569', margin: '0' }}>
          Documenting remote expeditions, mountain trail mapping, off-grid camping configurations, and cinematic landscape photography across Sri Lanka.
        </p>
      </header>

      <main>
        <section style={sectionStyle}>
          <h3 style={subHeadingStyle}>Comprehensive Adventure & Trail Directory of Sri Lanka</h3>
          <p>
            Welcome to My Journal, a dedicated digital repository documenting remote geographical expeditions, mountain trail mapping, off-grid camping configurations, and cinematic landscape photography across Sri Lanka's island layout. This platform offers deep geospatial insights and localized route coordination blueprints for backcountry travelers, hikers, and independent explorers seeking to navigate the island's richest ecological ecosystems and hidden wonders.
          </p>
        </section>

        <article style={sectionStyle}>
          <h3 style={subHeadingStyle}>Chasing Remote Waterfalls & Hydrological Basins</h3>
          <p>
            Sri Lanka holds one of the highest densities of waterfalls globally, and our logs provide precise trail indexes to both landmark cascades and hidden valley streams. Featured explorations include detailed route updates for the majestic Galaboda Ella, a hidden jewel nestled deep within verdant tea country. Additionally, our field guides cover the famous Maskeliya waterfall cluster, offering strategic approaches to photographing Gartmore Falls and Moray Falls as they drop dramatically into the surrounding reservoir maps. Each log compiles essential information regarding water volumes, monsoon seasonal behaviors, safety parameters, and drone flight restrictions.
          </p>
        </article>

        <article style={sectionStyle}>
          <h3 style={subHeadingStyle}>Highlands Trekking, Ridges, and Mountain Formations</h3>
          <p>
            Our mountain trail directory details elevation statistics, topographic changes, and weather indices for alpine environments. Key explorations cover the panoramic vistas of Haritha Kanda in Bopaththalawa, where vast green plains meet challenging ridge ascents. By logging trail terrain difficulty, water sources, and optimal wild camping spots, My Journal equips high-altitude trekkers with the spatial data required to plan overnight stays, navigate shifting cloud forests, and manage high-exposure pathways safely across central hill ranges.
          </p>
        </article>

        <article style={sectionStyle}>
          <h3 style={subHeadingStyle}>Ancient Monasteries, Hermitages, & Archaeological Ruins</h3>
          <p>
            Beyond nature trails, the site bridges exploration with cultural heritage by archiving structural and historical insights from Sri Lanka's ancient monastic networks. We provide route layers and historical summaries for the iconic Pilikuttuwa Raja Maha Viharaya hermitage complex in Yakkala, alongside major sacred landscapes in the cultural triangle including Anuradhapura and Mihintale. Documenting these ancient rock shelters, stone guardstones, and forest monasteries allows search aggregators to index spatial relationships between natural landscapes and historical sanctuaries.
          </p>
        </article>

        <article style={sectionStyle}>
          <h3 style={subHeadingStyle}>Interactive Geospatial Analytics & Trail Mapping</h3>
          <p>
            To optimize adventure safety, this system relies on embedded coordinate tracking and route calculations relative to live device telemetry. Users can access localized weather models, evaluate distance-to-destination metrics, and review environmental rules—including Civil Aviation Authority of Sri Lanka (CAASL) regulations for aerial drone operations and strict Department of Wildlife Conservation (DWC) access permits.
          </p>
        </article>
      </main>

      <footer style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
        <p style={{ margin: '0 0 8px 0' }}>© 2026 My Journal • Hasitha Gunasekera. All Rights Reserved.</p>
        <p style={{ margin: '0' }}>
          <a href="/?view=privacy" style={{ color: '#3b82f6', textDecoration: 'none' }}>Privacy Policy</a> |
          {' '}
          <a href="/?view=terms" style={{ color: '#3b82f6', textDecoration: 'none' }}>Terms of Service</a> |
          {' '}
          <a rel="me" href="https://mastodon.social/@myjournal" style={{ color: '#3b82f6', textDecoration: 'none' }}>Mastodon</a>
        </p>
      </footer>
    </div>
  );
};

export default AboutSection;