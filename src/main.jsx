import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Bookmark, BriefcaseBusiness, ExternalLink, RefreshCw, MapPin, Clock, CheckCircle2, FileText } from 'lucide-react';
import './styles.css';

const fallbackJobs = [
  { id: 'sample-1', title: 'Frontend Engineer', company_name: 'ApplyDesk Sample Co', candidate_required_location: 'Remote', job_type: 'full_time', publication_date: new Date().toISOString(), salary: '$120k - $170k', url: 'https://remotive.com/remote-jobs/software-dev', description: 'Build polished product experiences with React, TypeScript, and modern frontend patterns.', tags: ['React', 'TypeScript', 'CSS'] },
  { id: 'sample-2', title: 'Full Stack Developer', company_name: 'Remote Product Studio', candidate_required_location: 'Worldwide', job_type: 'full_time', publication_date: new Date(Date.now() - 86400000).toISOString(), salary: 'Salary not listed', url: 'https://remotive.com/remote-jobs/software-dev', description: 'Work across product features, APIs, databases, and customer-facing workflows.', tags: ['JavaScript', 'Node', 'SQL'] },
];

const starterResume = `Alex Morgan\nalex.morgan@example.com\n\nSoftware engineer with React, TypeScript, JavaScript, Python, SQL, Node, APIs, and product experience.`;
const knownSkills = ['React', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'Node', 'API', 'CSS', 'Design', 'Product', 'Marketing', 'Sales', 'Support', 'Ruby', 'Go', 'Java', 'PHP', 'AWS', 'Docker'];

function cleanHtml(html = '') {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function minutesSince(date) {
  const time = new Date(date || Date.now()).getTime();
  return Number.isFinite(time) ? Math.max(1, Math.round((Date.now() - time) / 60000)) : 1440;
}

function postedLabel(minutes) {
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function extractSkills(text) {
  return knownSkills.filter((skill) => text.toLowerCase().includes(skill.toLowerCase()));
}

function normalizeJob(job) {
  const description = cleanHtml(job.description);
  const skills = [...new Set([...(job.tags || []), ...extractSkills(`${job.title} ${description}`)])].slice(0, 6);
  return {
    id: String(job.id),
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || 'Remote',
    type: (job.job_type || 'full_time').replace(/_/g, ' '),
    salary: job.salary || 'Salary not listed',
    url: job.url,
    description: description || 'Open role from Remotive. Review the source listing for the full job description and application details.',
    skills: skills.length ? skills : ['Remote', 'Communication', 'Ownership'],
    minutes: minutesSince(job.publication_date),
  };
}

function App() {
  const [query, setQuery] = useState('software engineer');
  const [jobs, setJobs] = useState(fallbackJobs.map(normalizeJob));
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem('applydesk-saved') || '[]'));
  const [applications, setApplications] = useState(() => JSON.parse(localStorage.getItem('applydesk-applications') || '[]'));
  const [resume, setResume] = useState(() => localStorage.getItem('applydesk-resume') || starterResume);
  const [loading, setLoading] = useState(false);
  const [feedState, setFeedState] = useState('Live job feed');

  useEffect(() => localStorage.setItem('applydesk-saved', JSON.stringify(saved)), [saved]);
  useEffect(() => localStorage.setItem('applydesk-applications', JSON.stringify(applications)), [applications]);
  useEffect(() => localStorage.setItem('applydesk-resume', resume), [resume]);

  async function loadJobs(search = query) {
    setLoading(true);
    setFeedState('Loading live jobs');
    try {
      const params = new URLSearchParams({ limit: '60' });
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
      if (!response.ok) throw new Error('Feed unavailable');
      const data = await response.json();
      const liveJobs = (data.jobs || []).map(normalizeJob);
      if (!liveJobs.length) throw new Error('No matches');
      setJobs(liveJobs);
      setFeedState(`${liveJobs.length} live jobs from Remotive`);
    } catch (error) {
      setJobs(fallbackJobs.map(normalizeJob));
      setFeedState('Showing fallback jobs because the live feed did not respond');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadJobs('software engineer'); }, []);

  const resumeSkills = useMemo(() => extractSkills(resume), [resume]);
  const visibleJobs = useMemo(() => jobs.filter((job) => `${job.title} ${job.company} ${job.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [jobs, query]);

  function score(job) {
    if (!job.skills.length) return 45;
    const matches = job.skills.filter((skill) => resumeSkills.some((resumeSkill) => resumeSkill.toLowerCase() === skill.toLowerCase())).length;
    return Math.max(18, Math.round((matches / job.skills.length) * 100));
  }

  function toggleSaved(id) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function track(job, status = 'Preparing') {
    setApplications((current) => current.some((item) => item.id === job.id) ? current : [...current, { id: job.id, title: job.title, company: job.company, url: job.url, status }]);
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand">applydesk<span>.</span></div>
      <button className="nav active"><Search size={18}/> Live jobs</button>
      <button className="nav"><Bookmark size={18}/> Saved <strong>{saved.length}</strong></button>
      <button className="nav"><BriefcaseBusiness size={18}/> Applications <strong>{applications.length}</strong></button>
      <div className="side-card"><FileText size={24}/><b>Resume matching</b><p>Paste your resume and ApplyDesk estimates keyword fit before you apply.</p></div>
    </aside>

    <section className="workspace">
      <header className="hero">
        <div>
          <p className="eyebrow">LIVE REMOTE JOB SEARCH</p>
          <h1>Find real jobs and apply at the source.</h1>
          <p>ApplyDesk pulls live roles from Remotive, compares them to your resume, and keeps a simple application tracker in your browser.</p>
        </div>
        <span className="status"><RefreshCw size={14}/> {feedState}</span>
      </header>

      <section className="searchbar">
        <Search size={20}/>
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadJobs(query)} placeholder="Search title, company, or skill" />
        <button onClick={() => loadJobs(query)} disabled={loading}>{loading ? 'Loading...' : 'Search live jobs'}</button>
      </section>

      <section className="content-grid">
        <div>
          <div className="section-head"><b>{visibleJobs.length} opportunities</b><span>Updated when you search</span></div>
          <div className="jobs">
            {visibleJobs.map((job) => <article className="job-card" key={job.id}>
              <div className="job-top">
                <div className="logo">{job.company.slice(0, 2).toUpperCase()}</div>
                <div><p>{job.company}</p><button onClick={() => setSelected(job)}><h2>{job.title}</h2></button></div>
                <button className={`icon ${saved.includes(job.id) ? 'saved' : ''}`} onClick={() => toggleSaved(job.id)} aria-label="Save job"><Bookmark size={20} fill={saved.includes(job.id) ? 'currentColor' : 'none'}/></button>
              </div>
              <div className="meta"><span><MapPin size={14}/>{job.location}</span><span><Clock size={14}/>{postedLabel(job.minutes)}</span><span>{job.type}</span></div>
              <p className="description">{job.description.slice(0, 190)}...</p>
              <div className="skills">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <div className="actions"><span className="score">{score(job)}% match</span><button onClick={() => setSelected(job)}>Review</button><a href={job.url} target="_blank" rel="noreferrer" onClick={() => track(job)}>Apply <ExternalLink size={15}/></a></div>
            </article>)}
          </div>
        </div>

        <aside className="panel-stack">
          <section className="panel">
            <h3>Your resume</h3>
            <textarea value={resume} onChange={(event) => setResume(event.target.value)} aria-label="Resume text" />
            <div className="skills wrap">{resumeSkills.length ? resumeSkills.map((skill) => <span key={skill}>{skill}</span>) : <span>No skills detected yet</span>}</div>
          </section>
          <section className="panel">
            <h3>Application tracker</h3>
            {applications.length === 0 ? <p>No applications tracked yet. Open a source apply link to add one.</p> : applications.map((item) => <div className="tracked" key={item.id}><div><b>{item.title}</b><small>{item.company}</small></div><select value={item.status} onChange={(event) => setApplications((current) => current.map((row) => row.id === item.id ? { ...row, status: event.target.value } : row))}><option>Preparing</option><option>Submitted</option><option>Interviewing</option><option>Offer</option><option>Rejected</option></select></div>)}
          </section>
        </aside>
      </section>
    </section>

    {selected && <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-card">
        <button className="close" onClick={() => setSelected(null)}>Close</button>
        <p className="eyebrow">{selected.company}</p>
        <h2>{selected.title}</h2>
        <p>{selected.description}</p>
        <div className="skills wrap">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
        <div className="modal-actions"><button onClick={() => track(selected)}>Add to tracker</button><a href={selected.url} target="_blank" rel="noreferrer" onClick={() => track(selected)}>Apply on source site <ExternalLink size={16}/></a></div>
      </div>
    </div>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
