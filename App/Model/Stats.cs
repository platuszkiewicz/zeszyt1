using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace App.Model
{
    public class Stats
    {
        public double Average { get; set; }
        public int Median { get; set; }
        public int Dominant { get; set; }
        public double StandardDeviation { get; set; }
        public int Min { get; set; }
        public int Max { get; set; }

    }
}