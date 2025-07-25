import { json, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
  Card, CardBody, CardHeader, Input, Dropdown, DropdownTrigger,
  DropdownMenu, DropdownItem, Button, Pagination,
} from "@nextui-org/react";
import { Database, Filter, SortAsc, SortDesc, Search, Star, GitFork, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { fetchStatisticsRank } from "~/statistics/repository";
import type { RepoRankRecord } from "~/api/typing";

export const meta: MetaFunction = () => {
  return [
    { title: "All Repositories | Web3 Insights" },
    { property: "og:title", content: "All Repositories | Web3 Insights" },
    { name: "description", content: "Comprehensive analytics for all Web3 repositories including developer activity, stars, forks and contributions" },
  ];
};

export const loader = async () => {
  try {
    const rankResult = await fetchStatisticsRank();
    
    const repositories = rankResult.success ? rankResult.data.repository : [];
    
    if (!rankResult.success) {
      console.warn("Statistics rank fetch failed:", rankResult.message);
    }

    // Calculate totals from the real data
    const totalStars = repositories.reduce((acc, repo) => acc + Number(repo.star_count), 0);
    const totalForks = repositories.reduce((acc, repo) => acc + Number(repo.forks_count), 0);
    const totalContributors = repositories.reduce((acc, repo) => acc + Number(repo.contributor_count), 0);

    return json({
      repositories,
      totalRepositories: repositories.length,
      totalStars,
      totalForks,
      totalContributors,
    });
  } catch (error) {
    console.error("Loader error in repositories route:", error);
    
    return json({
      repositories: [],
      totalRepositories: 0,
      totalStars: 0,
      totalForks: 0,
      totalContributors: 0,
    });
  }
};

export default function AllRepositoriesPage() {
  const { repositories, totalRepositories, totalStars, totalForks, totalContributors } = useLoaderData<typeof loader>();

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 25;

  // Filtering and sorting state
  const [filterValue, setFilterValue] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "star_count",
    direction: "descending",
  });

  // Filter repositories based on search query
  const filteredItems = useMemo(() => {
    let filtered = [...repositories];

    if (filterValue) {
      filtered = filtered.filter(repo =>
        repo.repo_name.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }

    return filtered;
  }, [repositories, filterValue]);

  // Sort filtered repositories
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof RepoRankRecord];
      const second = b[sortDescriptor.column as keyof RepoRankRecord];

      if (first === undefined || second === undefined) return 0;

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredItems, sortDescriptor]);

  // Calculate pagination
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedItems.slice(start, end);
  }, [sortedItems, page, rowsPerPage]);

  const pages = Math.ceil(sortedItems.length / rowsPerPage);

  // Handle sorting change
  const handleSortChange = (column: string) => {
    setSortDescriptor(prev => ({
      column,
      direction: prev.column === column && prev.direction === "ascending"
        ? "descending"
        : "ascending",
    }));
  };

  return (
    <div className="min-h-dvh bg-background dark:bg-background-dark pb-24">
      <div className="w-full max-w-content mx-auto px-6 pt-8">
        {/* Header and Overview */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database size={20} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Repositories</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Comprehensive analytics and insights across Web3 repositories
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          <Card className="bg-white dark:bg-surface-dark shadow-subtle border border-border dark:border-border-dark">
            <CardBody className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                  <Database size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Repositories</p>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalRepositories.toLocaleString()}
                  </h2>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-surface-dark shadow-subtle border border-border dark:border-border-dark">
            <CardBody className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl flex-shrink-0">
                  <Star size={20} className="text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Total Stars</p>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalStars.toLocaleString()}
                  </h2>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-surface-dark shadow-subtle border border-border dark:border-border-dark">
            <CardBody className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-xl flex-shrink-0">
                  <GitFork size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Total Forks</p>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalForks.toLocaleString()}
                  </h2>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-surface-dark shadow-subtle border border-border dark:border-border-dark">
            <CardBody className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-xl flex-shrink-0">
                  <Users size={20} className="text-warning" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Contributors</p>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalContributors.toLocaleString()}
                  </h2>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search repositories..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              startContent={<Search size={18} className="text-gray-400" />}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  startContent={<Filter size={18} />}
                >
                  Sort By
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Sort options">
                <DropdownItem key="repo_name" onClick={() => handleSortChange("repo_name")}>
                  <div className="flex items-center justify-between w-full">
                    <span>Repository Name</span>
                    {sortDescriptor.column === "repo_name" && (
                      sortDescriptor.direction === "ascending" ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownItem>
                <DropdownItem key="star_count" onClick={() => handleSortChange("star_count")}>
                  <div className="flex items-center justify-between w-full">
                    <span>Stars</span>
                    {sortDescriptor.column === "star_count" && (
                      sortDescriptor.direction === "ascending" ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownItem>
                <DropdownItem key="forks_count" onClick={() => handleSortChange("forks_count")}>
                  <div className="flex items-center justify-between w-full">
                    <span>Forks</span>
                    {sortDescriptor.column === "forks_count" && (
                      sortDescriptor.direction === "ascending" ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownItem>
                <DropdownItem key="open_issues_count" onClick={() => handleSortChange("open_issues_count")}>
                  <div className="flex items-center justify-between w-full">
                    <span>Open Issues</span>
                    {sortDescriptor.column === "open_issues_count" && (
                      sortDescriptor.direction === "ascending" ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownItem>
                <DropdownItem key="contributor_count" onClick={() => handleSortChange("contributor_count")}>
                  <div className="flex items-center justify-between w-full">
                    <span>Contributors</span>
                    {sortDescriptor.column === "contributor_count" && (
                      sortDescriptor.direction === "ascending" ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* Repositories Table */}
        <Card className="bg-white dark:bg-surface-dark shadow-subtle border border-border dark:border-border-dark overflow-hidden">
          <CardHeader className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database size={18} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Repository Analytics</h3>
            </div>
          </CardHeader>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Repository</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Stars</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Forks</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Issues</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Contributors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border-dark">
                {paginatedItems.map((repo, index) => {
                  const absoluteIndex = (page - 1) * rowsPerPage + index + 1;
                  return (
                    <tr 
                      key={repo.repo_id} 
                      className="hover:bg-surface dark:hover:bg-surface-dark transition-colors duration-200 group animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all duration-200 group-hover:scale-110
                            ${absoluteIndex === 1 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                      absoluteIndex === 2 ? 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400' :
                        absoluteIndex === 3 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                          'bg-gray-50 dark:bg-gray-900/10 text-gray-500 dark:text-gray-500'}`}>
                            {absoluteIndex}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          to={`/repositories/${repo.repo_id}?name=${encodeURIComponent(repo.repo_name)}`} 
                          className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors duration-200"
                        >
                          {repo.repo_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                          {Number(repo.star_count).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                          {Number(repo.forks_count).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                          {Number(repo.open_issues_count).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                          {Number(repo.contributor_count).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {pages > 1 && (
            <div className="px-6 py-4 border-t border-border dark:border-border-dark flex justify-center">
              <Pagination
                page={page}
                total={pages}
                onChange={setPage}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
