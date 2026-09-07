// The scene carries the identity; these panels hold the detail on demand.
export const pages = {
  about: {
    title: 'Theodore Manassis',
    html: `<div class="tag">01 / ABOUT</div>
      <h1>Theodore Manassis.</h1>
      <p class="lead">Senior software engineer. Local AI model tinkerer. Open-source maintainer.</p>
      <p>At the Ministry of Justice Office of the CTO, I design and maintain software, applications and infrastructure for FinOps and GreenOps—helping teams understand and optimise cloud use, cost and environmental impact.</p>
      <div class="career-path" aria-label="Career path">
        <section><div class="signal-label">NOW</div><h2>Software engineering</h2><p>Tools and infrastructure for practical cloud optimisation.</p></section>
        <section><div class="signal-label">BEFORE</div><h2>Data engineering</h2><p>Production pipelines, Spark, Apache Iceberg and dbt for data-lakehouse platforms at the MoJ.</p></section>
        <section><div class="signal-label">EARLIER</div><h2>Data science & linkage</h2><p>Large-scale statistical linkage in AWS and PySpark; one of the main contributors to Splink. At the ONS: NLP, document classification, summarisation and graph databases.</p></section>
      </div>
      <p class="education">MSc Operational Research and Applied Statistics · Cardiff University</p>
      <div class="signal-group">
        <div class="signal-label">CURRENT BUILDS · FINOPS</div>
        <div class="project-links current-builds">
          <a href="https://github.com/ministryofjustice/moj-copilot-ai-credits-dashboard" target="_blank" rel="noopener noreferrer"><strong>AI Credits Dashboard</strong><span>Lead contributor · Flask and Chart.js views of GitHub Copilot usage, plans and projected spend across the MoJ.</span><i>↗</i></a>
          <a href="https://github.com/ministryofjustice/coat-copilot-usage-pipeline" target="_blank" rel="noopener noreferrer"><strong>Usage Pipeline</strong><span>Lead contributor · Python and Airflow pipeline from GitHub metrics to partitioned Parquet in S3, queryable through Athena.</span><i>↗</i></a>
        </div>
      </div>
      <div class="signal-group" aria-label="Languages and systems">
        <div class="signal-label">LANGUAGES & SYSTEMS</div>
        <ul class="signal-list">
          <li>Python</li><li>Scala</li><li>R</li><li>Go</li><li>Lua</li><li>C++</li><li>C#</li><li>JavaScript</li>
          <li>Spark</li><li>dbt</li><li>Iceberg</li><li>Terraform</li><li>Docker</li><li>GitHub Actions</li><li>JUCE</li>
        </ul>
      </div>
      <div class="signal-group">
        <div class="signal-label">OPEN SOURCE</div>
        <div class="project-links">
          <a href="https://github.com/moj-analytical-services/splink" target="_blank" rel="noopener noreferrer"><strong>splink</strong><span>Probabilistic data linkage at scale</span><i>↗</i></a>
          <a href="https://github.com/moj-analytical-services/splink_graph" target="_blank" rel="noopener noreferrer"><strong>splink_graph</strong><span>Graph metrics for linked data</span><i>↗</i></a>
          <a href="https://github.com/moj-analytical-services/splink_scalaudfs" target="_blank" rel="noopener noreferrer"><strong>splink_scalaudfs</strong><span>Scala linkage functions for Spark</span><i>↗</i></a>
        </div>
      </div>
      <nav class="social-links" aria-label="Find Theodore elsewhere">
        <a href="https://github.com/mamonu" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        <a href="https://www.linkedin.com/in/theodoremanassis/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        <a href="https://bsky.app/profile/mamonu.bsky.social" target="_blank" rel="noopener noreferrer">Bluesky ↗</a>
        <a href="https://twitter.com/_TheodoreM_" target="_blank" rel="noopener noreferrer">X / Twitter ↗</a>
      </nav>
      <p class="cat-signal"><span aria-hidden="true">↳</span> Yes. I am a cat person.</p>
      `,
  },
  writings: {
    title: 'Writings',
    html: `<div class="tag">03 / WRITINGS</div>
      <h1>Notes from the field.</h1>
      <p class="lead">Data systems, software engineering and small machines doing surprisingly large things.</p>
      <div class="signal-group">
        <div class="signal-label">LATEST ON mamonu DEV BLOG</div>
        <ul class="archive-list writings-list">
          <li><a href="https://mamonu.hashnode.dev/testing-using-property-based-tests" target="_blank" rel="noopener noreferrer"><time datetime="2026-09-03">03 SEP 2026 · 5 MIN</time>Testing using Property Based Tests <span>↗</span></a></li>
          <li><a href="https://mamonu.hashnode.dev/turning-a-dell-optiplex-7060-sff-into-a-cheap-local-ai-inference-box" target="_blank" rel="noopener noreferrer"><time datetime="2026-08-23">23 AUG 2026 · 12 MIN</time>Turning a Dell OptiPlex 7060 SFF into a Cheap Local AI Inference Box <span>↗</span></a></li>
          <li><a href="https://mamonu.hashnode.dev/running-a-a-27b-model-in-3-5-gb-vram" target="_blank" rel="noopener noreferrer"><time datetime="2026-08-22">22 AUG 2026 · 12 MIN</time>Running a 27B Model in 3.5 GB VRAM <span>↗</span></a></li>
          <li><a href="https://mamonu.hashnode.dev/exposing-an-lm-studio-server-running-in-wsl2-to-your-lan" target="_blank" rel="noopener noreferrer"><time datetime="2026-08-22">22 AUG 2026 · 12 MIN</time>Exposing an LM Studio Server Running in WSL2 to Your LAN <span>↗</span></a></li>
        </ul>
        <a class="profile-link" href="https://mamonu.hashnode.dev/" target="_blank" rel="noopener noreferrer">All writing on Hashnode ↗</a>
      </div>
      <div class="writing-feature">
        <div class="signal-label">TECHNICAL CONTRIBUTION · MOJ · 2024</div>
        <a href="https://ministryofjustice.github.io/data-and-analytics-engineering/blog/posts/building-a-transaction-data-lake-using-amazon-athena-apache-iceberg-and-dbt/" target="_blank" rel="noopener noreferrer">
          <h2>Building a transaction data lake using Amazon Athena, Apache Iceberg and dbt</h2>
          <p>A robust, maintainable ELT architecture that cut individual query costs by 99% and the longest job runtimes by 75%.</p><i>READ ↗</i>
        </a>
      </div>
      <div class="signal-group publications">
        <div class="signal-label">RESEARCH & PROCEEDINGS</div>
        <div class="publication-grid">
          <a href="https://ijpds.org/index.php/ijpds/article/view/1794" target="_blank" rel="noopener noreferrer">
            <time datetime="2022">IJPDS · 2022</time>
            <h2>Splink: Free software for probabilistic record linkage at scale</h2>
            <p>Co-authored research on an open-source, flexible and scalable approach to probabilistic data linkage.</p>
            <span>DOI 10.23889/ijpds.v7i3.1794 ↗</span>
          </a>
          <a href="https://onsbigdata.github.io/publications/" target="_blank" rel="noopener noreferrer">
            <time datetime="2016">21ST GSS METHODOLOGY SYMPOSIUM · 2016</time>
            <h2>Use of Graph Databases to Improve the Management and Quality of Linked Data</h2>
            <p>Co-authored proceedings exploring graph databases as tools for managing the outcomes and quality of data linkage.</p>
            <span>ONS PUBLICATION RECORD ↗</span>
          </a>
        </div>
      </div>`,
  },
};

export function routeFromHash(hash) {
  const key = hash.replace(/^#\/?/, '');
  if (key === 'archive') return 'writings';
  if (key === 'activity') return 'activity';
  return Object.hasOwn(pages, key) ? key : null;
}
