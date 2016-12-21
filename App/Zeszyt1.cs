using App.Model;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Data.OleDb;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Web;
using System.Windows;
using System.Linq;

namespace App
{
    public class Zeszyt1 : IHttpHandler
    {
        #region IHttpHandler Members

        public bool IsReusable
        {
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            var request = context.Request;
            var response = context.Response;
            var action = request.Params["action"];

            try
            {
                object result = null;
                switch (action)
                {
                    case "init":
                        result = "test";
                        break;
                    case "addNew":
                        AddNew(request);
                        break;
                    case "removeLast":
                        RemoveLast(request);
                        break;
                    case "addLog":
                        AddLog(request);
                        break;
                }

                var jsonResult = new JsonResult()
                {
                    Success = true,
                    Status = "SUCCESS",
                    Value = result,
                };

                var JsonResultString = JsonConvert.SerializeObject(jsonResult);
                response.Write(JsonResultString);
            }
            catch (WarningException ex)
            {
                var jsonResult = new JsonResult()
                {
                    Success = false,
                    Status = "WARNING",
                    Message = ex.Message
                };
                var jsonResultStr = JsonConvert.SerializeObject(jsonResult);
                response.Write(jsonResultStr);
            }
            catch (Exception ex)
            {
                var jsonResult = new JsonResult()
                {
                    Success = false,
                    Status = "ERROR",
                    Value = ex.Message
                };
                var JsonResultString = JsonConvert.SerializeObject(jsonResult);
                response.Write(JsonResultString);
            }
        }

        private void AddLog(HttpRequest request)
        {
            string path = AppDomain.CurrentDomain.BaseDirectory;
            string output = "";
            using (StreamReader r = new StreamReader(path + "/Data/log.json"))
            {
                string json = r.ReadToEnd();
                List<Log> items = JsonConvert.DeserializeObject<List<Log>>(json);

                var lastLog = new Log();

                var newLog = new Log();
                newLog.Id = items[items.Count - 1].Id + 1;
                newLog.City = request.Params["City"];
                newLog.Country = request.Params["Country"];
                newLog.Datetime = request.Params["Datetime"];
                newLog.Ip = request.Params["Ip"];
                newLog.LoginInfo = request.Params["LoginInfo"];
                newLog.Mobile = request.Params["Mobile"];
                newLog.UserAgent = request.Params["UserAgent"];

                items.Add(newLog);
                output = Newtonsoft.Json.JsonConvert.SerializeObject(items, Newtonsoft.Json.Formatting.Indented);
            }
            System.IO.File.WriteAllText(path + "Data/log.json", output);
        }

        private void RemoveLast(HttpRequest request)
        {
            string path = AppDomain.CurrentDomain.BaseDirectory;
            string output = "";
            using (StreamReader r = new StreamReader(path + "/Data/dates.json"))
            {
                string json = r.ReadToEnd();
                List<Event> items = JsonConvert.DeserializeObject<List<Event>>(json);

                items.Remove(items.Last());
                
                output = Newtonsoft.Json.JsonConvert.SerializeObject(items, Newtonsoft.Json.Formatting.Indented);
            }
            System.IO.File.WriteAllText(path + "Data/dates.json", output);

            using (StreamReader r = new StreamReader(path + "/Data/dates.json"))
            {
                string json = r.ReadToEnd();
                List<Event> items = JsonConvert.DeserializeObject<List<Event>>(json);

                List<int> periodDurations = new List<int>();
                foreach (var periodData in items)
                {
                    periodDurations.Add(periodData.Length);
                }
                int[] periodDurationsArray = periodDurations.ToArray();
                CalculateStats(periodDurationsArray);
            }
        }

        private void AddNew(HttpRequest request)
        {
            string path = AppDomain.CurrentDomain.BaseDirectory;
            string output = "";
            using (StreamReader r = new StreamReader( path + "/Data/dates.json"))
            {
                string json = r.ReadToEnd();
                List<Event> items = JsonConvert.DeserializeObject<List<Event>>(json);

                var lastDate = new DateTime();
                lastDate = DateTime.ParseExact(items[items.Count-1].Date, "yyyy-MM-dd", CultureInfo.InvariantCulture);

                var newDate = new Event();
                newDate.Id = items.Count+1;
                newDate.Date = request.Params["Event"].Substring(6, 4) + "-"+request.Params["Event"].Substring(3, 2) +"-"+ request.Params["Event"].Substring(0, 2);
                newDate.Length = (DateTime.ParseExact(newDate.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture) - lastDate).Days;
                items.Add(newDate);
                output = Newtonsoft.Json.JsonConvert.SerializeObject(items, Newtonsoft.Json.Formatting.Indented);             
            }
            System.IO.File.WriteAllText(path + "Data/dates.json", output);

            using (StreamReader r = new StreamReader(path + "/Data/dates.json"))
            {
                string json = r.ReadToEnd();
                List<Event> items = JsonConvert.DeserializeObject<List<Event>>(json);

                List<int> periodDurations = new List<int>();
                foreach(var periodData in items){
                    periodDurations.Add(periodData.Length);
                }
                int[] periodDurationsArray = periodDurations.ToArray();
                CalculateStats(periodDurationsArray);
            }
        }

        private void CalculateStats(params int[] Events)
        {
            string path = AppDomain.CurrentDomain.BaseDirectory;
            string output = "";

            var Stats = new Stats();
            Stats.Average = Math.Round(Events.Average(),2);
            Stats.Median = GetMedian(Events);
            Stats.Dominant = GetDominant(Events);
            Stats.StandardDeviation = Math.Round(GetStandardDeviation(Events),2);
            Stats.Min = Events.Min();
            Stats.Max = Events.Max();

            output = Newtonsoft.Json.JsonConvert.SerializeObject(Stats, Newtonsoft.Json.Formatting.Indented);
            
            System.IO.File.WriteAllText(path + "Data/stats.json", output);
        }

        public static int GetMedian(int[] sourceNumbers)
        {
            //Framework 2.0 version of this method. there is an easier way in F4        
            if (sourceNumbers == null || sourceNumbers.Length == 0)
                throw new System.Exception("Median of empty array not defined.");

            //make sure the list is sorted, but use a new array
            int[] sortedPNumbers = (int[])sourceNumbers.Clone();
            Array.Sort(sortedPNumbers);

            //get the median
            int size = sortedPNumbers.Length;
            int mid = size / 2;
            int median = (size % 2 != 0) ? (int)sortedPNumbers[mid] : ((int)sortedPNumbers[mid] + (int)sortedPNumbers[mid - 1])/2;
            return median;
        }

        public static int GetDominant(int[] sourceNumbers)
        {
            if (sourceNumbers == null || sourceNumbers.Length == 0)
                throw new System.Exception("Dominant of empty array not defined.");
            int[] sortedPNumbers = (int[])sourceNumbers.Clone();
            Array.Sort(sortedPNumbers);
            int min = sortedPNumbers[0];
            int max = sortedPNumbers[sortedPNumbers.Length - 1];

            int dominant = 0;
            int counterMax = 0;
            for (int i = min; i < max; i++)
            {
                int counter = 0;
                for (int j = 0; j < sourceNumbers.Length; j++)
                {
                    if (sourceNumbers[j] == i)
                    {
                        counter++;
                    }
                }
                if (counter > counterMax)
                {
                    dominant = i;
                    counterMax = counter;
                }
            }
            return dominant;
        }

        public static double GetStandardDeviation(int[] sourceNumbers)
        {
            double average = sourceNumbers.Average();
            double sumOfSquaresOfDifferences = sourceNumbers.Select(val => (val - average) * (val - average)).Sum();
            return Math.Sqrt(sumOfSquaresOfDifferences / sourceNumbers.Length); 
        }

        #endregion
    }
}
